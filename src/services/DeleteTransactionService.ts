import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void>
  {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionFound = await transactionsRepository.findOne({ where: { id: id } });

    if(!transactionFound)
    {
      throw new AppError('Transaction not found', 404);
    }

    await transactionsRepository.remove(transactionFound);
  }
}

export default DeleteTransactionService;
