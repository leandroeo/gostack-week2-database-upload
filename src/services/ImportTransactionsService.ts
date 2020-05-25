import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVRowTransaction {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {

    const parsers = csvParse({
      from_line: 2,
    })

    const fileImportReadStream = fs.createReadStream(filePath);
    const parseCSV = fileImportReadStream.pipe(parsers);

    const categories: string[] = [];
    const transactions: CSVRowTransaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) => cell.trim());

      if(!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoryRepository = getRepository(Category);
    const existingCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      }
    });

    // Retrieve existing categories
    const existingCategoriesTitle = existingCategories.map(
      (category: Category) => category.title,
    );

    // Categories to be created
    const addCategoriesTitle = categories
      .filter(categoryTitle => !existingCategoriesTitle.includes(categoryTitle))
      .filter((value, index, self) => self.indexOf(value) === index);

    // Creation of new categories
    const newCategories = categoryRepository.create(
      addCategoriesTitle.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const categoriesAvailable = [ ...newCategories, ...existingCategories];

    // Create transactions
    const transactionRepository = getCustomRepository(
      TransactionsRepository,
    );

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => (
        {
          title: transaction.title,
          value: transaction.value,
          type: transaction.type,
          category: categoriesAvailable.find(category => category.title === transaction.category)
        }
      ))
    );

    await transactionRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
