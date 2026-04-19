"""Tip Calculator — Functions in Python

Dinner's over and the check arrives. Build a set of helper functions
to calculate tips, split bills, and print a clean receipt.

Run your solution:  python main.py
Run the tests:      python -m pytest test_functions.py -v
"""


def calculate_tip(bill_amount, tip_percent):
    """Calculate the tip amount.

    Args:
        bill_amount: The pre-tip total (float).
        tip_percent: The tip as a whole number (e.g. 20 means 20%).

    Returns:
        The tip amount as a float.
    """
    # TODO 1: Calculate and return the tip
    # Formula: bill_amount * (tip_percent / 100)
    pass


def split_bill(total, num_people):
    """Split a total evenly among a group.

    Args:
        total: The total amount to split (float).
        num_people: How many people are splitting (int).

    Returns:
        The amount each person owes, rounded to 2 decimal places.
        If num_people is 0 or negative, return 0.0.
    """
    # TODO 2: Split the total and round to 2 decimal places
    # Handle the edge case where num_people <= 0
    pass


def calculate_total(bill_amount, tip_percent=18):
    """Calculate the total bill including tip, with a default tip of 18%.

    Args:
        bill_amount: The pre-tip total (float).
        tip_percent: The tip percentage (default 18).

    Returns:
        The total amount (bill + tip) as a float.
    """
    # TODO 3: Use calculate_tip() and add it to bill_amount
    # The default tip_percent should be 18 if none is provided
    pass


def format_receipt(bill_amount, tip_percent, num_people):
    """Return a multi-line receipt string.

    The receipt should look like:
        --- Receipt ---
        Subtotal:  $85.50
        Tip (20%): $17.10
        Total:     $102.60
        Split 4 ways: $25.65 each

    Args:
        bill_amount: The pre-tip total (float).
        tip_percent: The tip percentage (int).
        num_people: Number of people splitting (int).

    Returns:
        A formatted multi-line string.
    """
    # TODO 4: Build and return the receipt string
    # Use calculate_tip(), calculate_total(), and split_bill()
    pass


def item_total(*prices):
    """Calculate the total of a variable number of item prices.

    Args:
        *prices: Any number of individual item prices.

    Returns:
        The sum of all prices.
        Returns 0.0 if no prices are given.
    """
    # TODO 5: Use *args to accept any number of prices and return the sum
    pass


if __name__ == '__main__':
    print('=== Tip Calculator ===\n')

    bill = 85.50
    tip_pct = 20
    people = 4

    receipt = format_receipt(bill, tip_pct, people)
    if receipt:
        print(receipt)

    # Try item_total with variable arguments
    items = item_total(12.99, 15.50, 8.75, 22.00, 9.99)
    if items:
        print(f'\nItem total: ${items:.2f}')
