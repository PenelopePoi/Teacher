"""Personal Budget Calculator — Variables and Data Types

You just got your first paycheck. Let's figure out where the money goes.
Complete the TODOs below to build a simple monthly budget calculator.

Run your solution:  python main.py
Run the tests:      python -m pytest test_variables.py -v
"""


def create_budget():
    """Create budget variables and return a summary dictionary.

    Returns a dict with keys:
        income, rent, food, transport, savings_goal,
        total_expenses, remaining, savings_rate
    """

    # TODO 1: Create a variable for monthly income (use a realistic number, e.g. 3500.00)
    income = None

    # TODO 2: Create variables for each expense category
    rent = None        # e.g. 1200.00
    food = None        # e.g. 450.00
    transport = None   # e.g. 150.00
    savings_goal = None  # e.g. 500.00

    # TODO 3: Calculate total expenses (sum of rent, food, transport, savings_goal)
    total_expenses = None

    # TODO 4: Calculate remaining balance (income minus total expenses)
    remaining = None

    # TODO 5: Calculate savings rate as a percentage of income
    # Formula: (savings_goal / income) * 100
    savings_rate = None

    return {
        'income': income,
        'rent': rent,
        'food': food,
        'transport': transport,
        'savings_goal': savings_goal,
        'total_expenses': total_expenses,
        'remaining': remaining,
        'savings_rate': savings_rate,
    }


def format_budget_line(label, amount):
    """Return a formatted budget line like '  Rent: $1200.00'.

    Args:
        label: The category name (str)
        amount: The dollar amount (int or float)

    Returns:
        A formatted string with the label right-padded and the amount
        shown with two decimal places and a dollar sign.
    """
    # TODO 6: Use an f-string to return the formatted line
    # Example output: "  Rent: $1200.00"
    pass


if __name__ == '__main__':
    budget = create_budget()
    if budget['income'] is not None:
        print('=== Monthly Budget ===')
        print(format_budget_line('Income', budget['income']))
        print('--- Expenses ---')
        for category in ['rent', 'food', 'transport', 'savings_goal']:
            print(format_budget_line(category.replace('_', ' ').title(), budget[category]))
        print('---')
        print(format_budget_line('Total Expenses', budget['total_expenses']))
        print(format_budget_line('Remaining', budget['remaining']))
        print(f"  Savings Rate: {budget['savings_rate']:.1f}%")
    else:
        print('Fill in the TODOs to see your budget!')
