"""Tests for the Tip Calculator.

These tests check calculations, default parameters, and edge cases.
Run with: python -m pytest test_functions.py -v
"""
from main import calculate_tip, split_bill, calculate_total, format_receipt, item_total


def test_calculate_tip():
    """calculate_tip should return the correct tip amount."""
    assert calculate_tip(100.00, 20) == 20.00
    assert calculate_tip(50.00, 15) == 7.50
    assert abs(calculate_tip(85.50, 18) - 15.39) < 0.01


def test_split_bill_evenly():
    """split_bill should divide total evenly and round to 2 decimal places."""
    assert split_bill(100.00, 4) == 25.00
    assert split_bill(85.50, 3) == 28.50
    assert split_bill(10.00, 3) == 3.33


def test_split_bill_edge_case():
    """split_bill should return 0.0 when num_people is 0 or negative."""
    assert split_bill(100.00, 0) == 0.0
    assert split_bill(100.00, -2) == 0.0


def test_calculate_total_default_tip():
    """calculate_total should use 18% as the default tip."""
    result = calculate_total(100.00)
    assert result == 118.00, f"With default 18% tip on $100, total should be $118.00, got ${result}"


def test_calculate_total_custom_tip():
    """calculate_total should accept a custom tip percentage."""
    result = calculate_total(100.00, tip_percent=25)
    assert result == 125.00


def test_format_receipt_contains_info():
    """format_receipt should include subtotal, tip, total, and per-person amount."""
    result = format_receipt(100.00, 20, 4)
    assert result is not None, "format_receipt returned None — did you forget to return?"
    assert '100.00' in result, "Receipt should include the subtotal"
    assert '20.00' in result, "Receipt should include the tip amount"
    assert '120.00' in result, "Receipt should include the total"
    assert '30.00' in result, "Receipt should include the per-person amount"


def test_item_total_variable_args():
    """item_total should sum any number of prices."""
    assert item_total(10.00, 20.00, 30.00) == 60.00
    assert item_total(5.99) == 5.99
    assert item_total() == 0.0
