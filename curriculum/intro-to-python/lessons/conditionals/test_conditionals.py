"""Tests for the Grade Calculator.

These tests cover all grade boundaries and edge cases.
Run with: python -m pytest test_conditionals.py -v
"""
from main import score_to_grade, pass_fail_honors, feedback


# --- score_to_grade tests ---

def test_grade_a():
    """Scores 90-100 should earn an A."""
    assert score_to_grade(90) == 'A'
    assert score_to_grade(95) == 'A'
    assert score_to_grade(100) == 'A'


def test_grade_b():
    """Scores 80-89 should earn a B."""
    assert score_to_grade(80) == 'B'
    assert score_to_grade(85) == 'B'
    assert score_to_grade(89) == 'B'


def test_grade_c_d_f():
    """Scores in C, D, and F ranges should return the correct grade."""
    assert score_to_grade(75) == 'C'
    assert score_to_grade(65) == 'D'
    assert score_to_grade(59) == 'F'
    assert score_to_grade(0) == 'F'


def test_grade_invalid_scores():
    """Negative scores and scores over 100 should return 'Invalid'."""
    assert score_to_grade(-1) == 'Invalid'
    assert score_to_grade(-50) == 'Invalid'
    assert score_to_grade(101) == 'Invalid'
    assert score_to_grade(200) == 'Invalid'


# --- pass_fail_honors tests ---

def test_honors():
    """Scores 90+ should earn Honors."""
    assert pass_fail_honors(90) == 'Honors'
    assert pass_fail_honors(100) == 'Honors'


def test_pass_and_fail():
    """Scores 60-89 pass; below 60 fail."""
    assert pass_fail_honors(60) == 'Pass'
    assert pass_fail_honors(89) == 'Pass'
    assert pass_fail_honors(59) == 'Fail'
    assert pass_fail_honors(0) == 'Fail'


def test_pass_fail_invalid():
    """Out-of-range scores return 'Invalid'."""
    assert pass_fail_honors(-10) == 'Invalid'
    assert pass_fail_honors(150) == 'Invalid'


# --- feedback tests ---

def test_feedback_messages():
    """Each score range should produce the correct feedback."""
    assert feedback(95) == 'Outstanding work — ready for the studio.'
    assert feedback(82) == 'Strong performance — keep refining your craft.'
    assert feedback(73) == 'Solid foundation — practice will get you there.'
    assert feedback(65) == 'You passed, but revisit the fundamentals.'
    assert feedback(48) == 'Not yet passing — let\'s identify what tripped you up.'
    assert feedback(30) == 'We need to talk — come to office hours.'
    assert feedback(-5) == 'Score out of range.'
    assert feedback(110) == 'Score out of range.'
