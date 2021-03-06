import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BudgetService} from '../../services/budget.service';
import {Budget} from '../../models/budget.model';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {BudgetIncomeService} from '../../services/budget-income.service';
import {BudgetExpenseService} from '../../services/budget-expense.service';
import {IncomeStream} from '../../models/income-stream.model';
import {Expense} from '../../models/expense.model';
import {MatDialog, MatDialogRef, MatMenuTrigger} from '@angular/material';
import {Location} from '@angular/common';

@Component({
  selector: 'app-budget-detail',
  templateUrl: './budget-detail.component.html',
  styleUrls: ['./budget-detail.component.scss']
})
export class BudgetDetailComponent implements OnInit, OnDestroy {

  @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;

  budgetSubscription: Subscription;
  incomeStreamSubscription: Subscription;
  expenseSubscription: Subscription;
  incomeTotalSubscription: Subscription;
  expenseTotalSubscription: Subscription;

  budgetId: string;
  selectedBudget: Budget;
  totalBudgetRemaining: number;

  budgetIncomeStreams: IncomeStream[] = [];
  budgetIncomeTotal: number;
  selectedIncome: IncomeStream;

  budgetExpenses: Expense[] = [];
  budgetExpenseTotal: number;
  selectedExpense: Expense;

  selectedItem: (IncomeStream | Expense);
  isBalancePositive: boolean;

  dialogRef: MatDialogRef<any>;

  isLoading: boolean;

  constructor(private budgetService: BudgetService,
              public incomeService: BudgetIncomeService,
              public expenseService: BudgetExpenseService,
              private route: ActivatedRoute,
              private location: Location,
              private matDialog: MatDialog) {
  }

  ngOnInit() {
    this.budgetId = this.route.snapshot.params['id'];
    this.budgetSubscription = this.budgetService.getBudgetById(this.budgetId).subscribe(budget => {
      this.isLoading = true;
      this.selectedBudget = budget;
      this.fetchAllIncomeForBudget(this.budgetId);
      this.fetchAllExpenseForBudget(this.budgetId);
    });
  }

  ngOnDestroy() {
    this.budgetSubscription.unsubscribe();
    this.incomeStreamSubscription.unsubscribe();
    this.incomeTotalSubscription.unsubscribe();
    this.expenseSubscription.unsubscribe();
    this.expenseTotalSubscription.unsubscribe();
  }

  fetchAllIncomeForBudget(budgetId: string) {
    this.incomeStreamSubscription = this.incomeService.getAllIncomeStreamsByBudget(budgetId).subscribe(incomeStreams => {
      if (incomeStreams) {
        this.budgetIncomeStreams = incomeStreams.map(incomeStream =>
          new IncomeStream({
            id: incomeStream.payload.doc.id,
            amount: incomeStream.payload.doc.data().amount,
            budgetId: incomeStream.payload.doc.data().budgetId,
            name: incomeStream.payload.doc.data().name,
            type: incomeStream.payload.doc.data().type,
          })
        );
        this.incomeTotalSubscription = this.incomeService.budgetIncomeTotal.subscribe(incomeTotal => {
          this.budgetIncomeTotal = incomeTotal;
          this.totalBudgetRemaining = this.deriveBudgetAmountRemaining(this.budgetIncomeTotal, this.budgetExpenseTotal);
        });
      } else {
        this.budgetIncomeTotal = 0;
      }
    });
  }

  fetchAllExpenseForBudget(budgetId: string) {
    this.expenseSubscription = this.expenseService.getAllExpensesByBudget(budgetId).subscribe(expenses => {
      if (expenses) {
        this.budgetExpenses = expenses.map(expense =>
          new Expense({
            id: expense.payload.doc.id,
            amount: expense.payload.doc.data().amount,
            budgetId: expense.payload.doc.data().budgetId,
            name: expense.payload.doc.data().name,
          })
        );
        this.expenseTotalSubscription = this.expenseService.budgetExpenseTotal.subscribe(expenseTotal => {
          this.budgetExpenseTotal = expenseTotal;
          this.totalBudgetRemaining = this.deriveBudgetAmountRemaining(this.budgetIncomeTotal, this.budgetExpenseTotal);
        });
      } else {
        this.budgetExpenseTotal = 0;
      }
      this.isLoading = false;
    });
  }

  openDialog(template, data) {
    if (data) {
      if (data instanceof Expense) {
        this.selectedItem = data;
        this.selectedExpense = data;
      } else if (data instanceof IncomeStream) {
        this.selectedItem = data;
        this.selectedIncome = data;
      }
    }
    this.dialogRef = this.matDialog.open(template, {
      width: '95%'
    });
  }

  deriveBudgetAmountRemaining(incomeTotal: number, expenseTotal: number): number {
    expenseTotal > incomeTotal ? this.isBalancePositive = false : this.isBalancePositive = true;
    return incomeTotal - expenseTotal;
  }

  deleteIncomeStream(id: string) {
    this.incomeService.deleteIncome(id);
  }

  deleteExpense(id: string) {
    this.isLoading = true;
    this.expenseService.deleteExpense(id)
      .then(() => {
        this.isLoading = false;
    });
  }

  clearSelectedIncome() {
    this.selectedIncome = null;
  }

  clearSelectedExpense() {
    this.selectedExpense = null;
  }

  goBack() {
    this.location.back();
  }

}
