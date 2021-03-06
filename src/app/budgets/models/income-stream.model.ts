export class IncomeStream {
  id: string;
  amount: number;
  budgetId: string;
  name: string;
  type: string;

  constructor(options: any) {
    this.id = options && options.id;
    this.amount = options && options.amount;
    this.budgetId = options && options.budgetId;
    this.name = options && options.name;
    this.type = options && options.type;
  }
}
