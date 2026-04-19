"""Grade Calculator — Conditionals in Python

You're grading a music production course. Scores range from 0 to 100.
Use if/elif/else to convert scores to letter grades, determine honors,
and give meaningful feedback.

Run your solution:  python main.py
Run the tests:      python -m pytest test_conditionals.py -v
"""


def score_to_grade(score):
    """Convert a numeric score (0-100) to a letter grade.

    Grading scale:
        90-100  -> 'A'
        80-89   -> 'B'
        70-79   -> 'C'
        60-69   -> 'D'
        0-59    -> 'F'

    Edge cases:
        score < 0    -> 'Invalid'
        score > 100  -> 'Invalid'

    Args:
        score: An integer or float representing the student's score.

    Returns:
        A single-character string grade, or 'Invalid' for out-of-range scores.
    """
    # TODO 1: Handle edge cases first (negative or over 100)

    # TODO 2: Use if/elif/else to return the correct letter grade
    pass


def pass_fail_honors(score):
    """Determine if a student passes, fails, or earns honors.

    Rules:
        score >= 90          -> 'Honors'
        60 <= score < 90     -> 'Pass'
        0 <= score < 60      -> 'Fail'
        out of range         -> 'Invalid'

    Args:
        score: An integer or float.

    Returns:
        One of: 'Honors', 'Pass', 'Fail', 'Invalid'
    """
    # TODO 3: Implement the pass/fail/honors logic
    pass


def feedback(score):
    """Give personalized feedback based on score ranges.

    Feedback messages:
        90-100  -> 'Outstanding work — ready for the studio.'
        80-89   -> 'Strong performance — keep refining your craft.'
        70-79   -> 'Solid foundation — practice will get you there.'
        60-69   -> 'You passed, but revisit the fundamentals.'
        40-59   -> 'Not yet passing — let's identify what tripped you up.'
        0-39    -> 'We need to talk — come to office hours.'
        invalid -> 'Score out of range.'

    Args:
        score: An integer or float.

    Returns:
        A feedback string.
    """
    # TODO 4: Return the appropriate feedback string for each range
    pass


if __name__ == '__main__':
    print('=== Music Production — Grade Report ===\n')

    test_scores = [95, 82, 73, 65, 48, 30, -5, 110]
    for s in test_scores:
        grade = score_to_grade(s)
        status = pass_fail_honors(s)
        msg = feedback(s)
        if grade != 'Invalid':
            print(f'  Score: {s:3d}  |  Grade: {grade}  |  Status: {status}')
            print(f'    -> {msg}')
        else:
            print(f'  Score: {s:3d}  |  {msg}')
    print()
