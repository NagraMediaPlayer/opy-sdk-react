# All basic tags are included just to ensure they will each launch
@dummy @high_priority @medium_priority @safari @robustness @long_play @PlayPauseSeekZap
Feature: Dummy feature just to allow us to use Cucumber Driver to launch the tests

    Scenario: Dummy scenario
        Given the version under test
        When we execute the tests
        Then we get an xml file of the result
