Feature: Calculator
Background:
Given the calculator is ready
Scenario: Add numbers
Given I enter 1
And I enter 2
When I add
Then the result is 3
Examples:
| a | b | sum |
| 1 | 2 | 3 |
| 10 | 20 | 30 |
