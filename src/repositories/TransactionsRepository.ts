import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getRepository(Transaction);

    const transactions = await transactionsRepository.find();

    // Income amount
    const income = transactions.reduce( function(sum: number, transaction: Transaction) {
      return transaction.type === 'income' ? sum + transaction.value : sum;
    }, 0);

    // Outcome amount
    const outcome = transactions.reduce( function(sum: number, transaction: Transaction) {
      return transaction.type === 'outcome' ? sum + transaction.value : sum;
    }, 0);

    // Total amount
    const total = income - outcome;

    const balance = {
      income,
      outcome,
      total
    }

    return balance;
  }

}

export default TransactionsRepository;
