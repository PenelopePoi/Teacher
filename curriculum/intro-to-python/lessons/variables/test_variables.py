"""Tests for the Personal Budget Calculator.

These tests verify that your budget variables are set up correctly
and that your calculations are accurate.
Run with: python -m pytest test_variables.py -v
"""
from main import create_budget, format_budget_line


def test_income_is_a_number():
    """income should be an int or float, not None or a string."""
    budget = create_budget()
    assert budget['income'] is not None, "Set your income — don't leave it as None"
    assert isinstance(budget['income'], (int, float)), "income should be a number"


def test_expenses_are_numbers():
    """Each expense category should be a number."""
    budget = create_budget()
    for key in ['rent', 'food', 'transport', 'savings_goal']:
        assert budget[key] is not None, f"Set your {key} — don't leave it as None"
        assert isinstance(budget[key], (int, float)), f"{key} should be a number"


def test_total_expenses_correct():
    """total_expenses should equal rent + food + transport + savings_goal."""
    budget = create_budget()
    expected = budget['rent'] + budget['food'] + budget['transport'] + budget['savings_goal']
    assert budget['total_expenses'] == expected, (
        f"total_expenses should be {expected}, got {budget['total_expenses']}"
    )


def test_remaining_balance_correct():
    """remaining should equal income minus total_expenses."""
    budget = create_budget()
    expected = budget['income'] - budget['total_expenses']
    assert budget['remaining'] == expected, (
        f"remaining should be {expected}, got {budget['remaining']}"
    )


def test_savings_rate_is_percentage():
    """savings_rate should be (savings_goal / income) * 100."""
    budget = create_budget()
    expected = (budget['savings_goal'] / budget['income']) * 100
    assert abs(budget['savings_rate'] - expected) < 0.01, (
        f"savings_rate should be {expected:.2f}%, got {budget['savings_rate']}"
    )


def test_format_budget_line_output():
    """format_budget_line should return a properly formatted string."""
    result = format_budget_line('Rent', 1200.00)
    assert result is not None, "format_budget_line returned None — did you forget to return?"
    assert '$' in result, "The formatted line should include a dollar sign"
    assert 'Rent' in result, "The formatted line should include the label"
    assert '1200.00' in result, "The amount should show two decimal places"
