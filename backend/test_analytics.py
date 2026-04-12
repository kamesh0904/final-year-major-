"""
Unit tests for analytics modules
"""

import pytest
from datetime import datetime, timedelta
from analytics.metrics_calculator import MetricsCalculator
from analytics.trend_analyzer import TrendAnalyzer
from analytics.chart_data_generator import ChartDataGenerator


class TestMetricsCalculator:
    """Test MetricsCalculator class"""
    
    @pytest.fixture
    def calculator(self):
        return MetricsCalculator()
    
    def test_calculate_engagement_metrics(self, calculator):
        """Test engagement metrics calculation"""
        # This would require mocking the database
        # For now, this is a placeholder for future implementation
        pass
    
    def test_empty_engagement_metrics(self, calculator):
        """Test empty metrics return correct structure"""
        empty = calculator._empty_engagement_metrics()
        assert empty["total_sessions"] == 0
        assert empty["streak_days"] == 0
        assert isinstance(empty["games_list"], list)


class TestTrendAnalyzer:
    """Test TrendAnalyzer class"""
    
    @pytest.fixture
    def analyzer(self):
        return TrendAnalyzer()
    
    def test_calculate_change_positive(self, analyzer):
        """Test positive percentage change calculation"""
        result = analyzer._calculate_change(100, 80)
        assert result["percentage"] == 25.0
        assert result["direction"] == "up"
    
    def test_calculate_change_negative(self, analyzer):
        """Test negative percentage change calculation"""
        result = analyzer._calculate_change(80, 100)
        assert result["percentage"] == -20.0
        assert result["direction"] == "down"
    
    def test_calculate_change_zero_previous(self, analyzer):
        """Test change calculation with zero previous value"""
        result = analyzer._calculate_change(50, 0)
        assert result["percentage"] == 100
        assert result["direction"] == "up"


class TestChartDataGenerator:
    """Test ChartDataGenerator class"""
    
    @pytest.fixture
    def generator(self):
        return ChartDataGenerator()
    
    def test_categorize_game_focus(self, generator):
        """Test game categorization for focus games"""
        assert generator._categorize_game("Focus Game") == "focus"
        assert generator._categorize_game("Attention Training") == "focus"
    
    def test_categorize_game_memory(self, generator):
        """Test game categorization for memory games"""
        assert generator._categorize_game("Memory Match") == "memory"
        assert generator._categorize_game("Recall Challenge") == "memory"
    
    def test_categorize_game_emotional(self, generator):
        """Test game categorization for emotional games"""
        assert generator._categorize_game("Emotion Recognition") == "emotional"
        assert generator._categorize_game("Mood Tracker") == "emotional"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
