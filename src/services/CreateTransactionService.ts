import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class CreateTransactionService {
  public async execute({ title, type, value, category }: TransactionDTO): Promise<Transaction> {

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    await this.validateDataInput({ title, type, value, category }, transactionsRepository);

    let categoryRecord = await this.getCategory(category);

    const transaction = transactionsRepository.create({
        title,
        value,
        category_id: categoryRecord.id,
        type
    });

    await transactionsRepository.insert(transaction);
    return transaction;
  }

  private async getCategory(categoryTitle: string): Promise<Category> {
    const categoryRepository = getRepository(Category);
    let category = await categoryRepository.findOne({ where: { title: categoryTitle.trim() } });

    // In case does not exists, create a new category.
    if(!category)
    {
      const categoryCreate = categoryRepository.create({
        title: categoryTitle
      });

      category = await categoryRepository.save(categoryCreate);
    }

    return category;
  }

  private async validateDataInput(
      { title, type, value, category }: TransactionDTO,
      transactionRepository: TransactionsRepository
  ): Promise<void> {
      // Validate enough balance
      if (type === 'outcome')
      {
        const balance = await transactionRepository.getBalance();
        if (balance.total < value)
        {
            throw new AppError('Insuficient balance for this transaction.');
        }
      }
      // Validate type of the transaction
      if (type !== 'income' && type !== 'outcome')
      {
        throw new AppError('Invalid transaction type.');
      }

  }

}

export default CreateTransactionService;
