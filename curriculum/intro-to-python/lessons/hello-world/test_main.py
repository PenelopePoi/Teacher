"""Tests for Your First Program.

These tests verify that your greet() and learning_goal() functions
work correctly. Run with: python -m pytest test_main.py -v
"""
from main import greet, learning_goal


def test_greet_returns_string():
    """greet() should return a string, not None."""
    result = greet('Student')
    assert result is not None, "greet() returned None — did you forget to return a value?"
    assert isinstance(result, str), "greet() should return a string"


def test_greet_includes_name():
    """greet() should include the person's name in the greeting."""
    result = greet('Ada')
    assert 'Ada' in result, "The greeting should include the person's name"


def test_greet_is_friendly():
    """greet() should contain a greeting word."""
    result = greet('Student').lower()
    greetings = ['hello', 'hi', 'hey', 'welcome', 'greetings']
    assert any(g in result for g in greetings), (
        "The greeting should contain a friendly word like 'Hello' or 'Welcome'"
    )


def test_learning_goal_returns_string():
    """learning_goal() should return a string describing what you want to learn."""
    result = learning_goal()
    assert result is not None, "learning_goal() returned None — tell us what you want to learn!"
    assert isinstance(result, str), "learning_goal() should return a string"


def test_learning_goal_is_meaningful():
    """learning_goal() should be a real sentence, not empty."""
    result = learning_goal()
    assert len(result) > 10, "Tell us more about what you want to learn — write at least a sentence"
