"""Tests for the Playlist Analyzer.

These tests verify that your loops produce the right output.
Run with: python -m pytest test_loops.py -v
"""
from main import (
    PLAYLIST, print_songs, find_first_long_song,
    create_tracklist, total_duration, short_songs,
)


def test_print_songs_format():
    """print_songs should return numbered song entries."""
    result = print_songs(PLAYLIST)
    assert len(result) == len(PLAYLIST), (
        f"Expected {len(PLAYLIST)} entries, got {len(result)}"
    )
    assert result[0] == '1. Golden Hour', (
        f"First entry should be '1. Golden Hour', got '{result[0]}'"
    )
    assert result[-1] == f'{len(PLAYLIST)}. Neon Nights', (
        f"Last entry should be '{len(PLAYLIST)}. Neon Nights', got '{result[-1]}'"
    )


def test_find_first_long_song():
    """find_first_long_song should return the first song over 4 minutes."""
    result = find_first_long_song(PLAYLIST)
    assert result is not None, "Should find at least one song over 4 minutes"
    assert result == 'Midnight Drive', (
        f"First song over 4 min is 'Midnight Drive', got '{result}'"
    )


def test_find_first_long_song_custom_threshold():
    """find_first_long_song should respect the min_duration parameter."""
    result = find_first_long_song(PLAYLIST, min_duration=5.0)
    assert result == 'Ocean Waves', (
        f"First song over 5 min is 'Ocean Waves', got '{result}'"
    )
    result_none = find_first_long_song(PLAYLIST, min_duration=10.0)
    assert result_none is None, "No songs are over 10 minutes — should return None"


def test_create_tracklist_format():
    """create_tracklist should produce zero-padded numbered entries with duration."""
    result = create_tracklist(PLAYLIST)
    assert len(result) == len(PLAYLIST)
    assert result[0] == '01. Golden Hour (3.5 min)', (
        f"First track should be '01. Golden Hour (3.5 min)', got '{result[0]}'"
    )


def test_total_duration():
    """total_duration should sum all song durations."""
    result = total_duration(PLAYLIST)
    expected = sum(d for _, d in PLAYLIST)
    assert abs(result - expected) < 0.01, (
        f"Total duration should be {expected}, got {result}"
    )


def test_short_songs_comprehension():
    """short_songs should return titles of songs under the threshold."""
    result = short_songs(PLAYLIST)
    assert isinstance(result, list), "short_songs should return a list"
    expected = [title for title, dur in PLAYLIST if dur < 3.0]
    assert result == expected, (
        f"Expected {expected}, got {result}"
    )
