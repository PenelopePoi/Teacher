"""Playlist Analyzer — Loops in Python

You've got a playlist of songs with their durations.
Use loops to analyze and transform the data.

Run your solution:  python main.py
Run the tests:      python -m pytest test_loops.py -v
"""

# Sample playlist: each tuple is (song_title, duration_in_minutes)
PLAYLIST = [
    ('Golden Hour', 3.5),
    ('Midnight Drive', 4.2),
    ('Sunrise', 2.8),
    ('Ocean Waves', 5.1),
    ('City Lights', 3.9),
    ('Quiet Storm', 4.7),
    ('Daydream', 2.4),
    ('Neon Nights', 3.1),
]


def print_songs(playlist):
    """Print each song with its index number (starting at 1).

    Expected output format:
        1. Golden Hour
        2. Midnight Drive
        ...

    Args:
        playlist: A list of (title, duration) tuples.

    Returns:
        A list of strings, each formatted as "{index}. {title}"
    """
    result = []
    # TODO 1: Use a for loop to build the result list
    # Each entry should be like "1. Golden Hour"

    return result


def find_first_long_song(playlist, min_duration=4.0):
    """Find the first song longer than min_duration using a while loop.

    Args:
        playlist: A list of (title, duration) tuples.
        min_duration: The minimum duration threshold (default 4.0).

    Returns:
        The title of the first song exceeding min_duration,
        or None if no song qualifies.
    """
    # TODO 2: Use a while loop to search through the playlist
    # Return the title of the first song with duration > min_duration
    pass


def create_tracklist(playlist):
    """Create a numbered tracklist with durations using enumerate.

    Expected format:
        "01. Golden Hour (3.5 min)"

    Args:
        playlist: A list of (title, duration) tuples.

    Returns:
        A list of formatted strings.
    """
    tracklist = []
    # TODO 3: Use enumerate to build the tracklist
    # Track numbers should be zero-padded to 2 digits (01, 02, etc.)

    return tracklist


def total_duration(playlist):
    """Calculate the total duration of all songs using a loop.

    Args:
        playlist: A list of (title, duration) tuples.

    Returns:
        The sum of all song durations as a float.
    """
    total = 0.0
    # TODO 4: Use a for loop to sum up all the durations

    return total


def short_songs(playlist, max_duration=3.0):
    """Filter songs shorter than max_duration using a list comprehension.

    Args:
        playlist: A list of (title, duration) tuples.
        max_duration: The maximum duration threshold (default 3.0).

    Returns:
        A list of song titles (strings) with duration < max_duration.
    """
    # TODO 5: Use a list comprehension to filter and return titles only
    return []


if __name__ == '__main__':
    print('=== Playlist Analyzer ===\n')

    songs = print_songs(PLAYLIST)
    if songs:
        print('Song List:')
        for s in songs:
            print(f'  {s}')

    long = find_first_long_song(PLAYLIST)
    if long:
        print(f'\nFirst long song: {long}')

    tracks = create_tracklist(PLAYLIST)
    if tracks:
        print('\nTracklist:')
        for t in tracks:
            print(f'  {t}')

    dur = total_duration(PLAYLIST)
    print(f'\nTotal playlist duration: {dur:.1f} minutes')

    quick = short_songs(PLAYLIST)
    if quick:
        print(f'\nQuick songs (under 3 min): {", ".join(quick)}')
