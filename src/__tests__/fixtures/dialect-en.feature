Business Need: Checkout
Background:
* the cart is empty
Rule: Cards
Example: Visa debit
Given a visa
When I pay
Then accepted
Scenario Template: Amounts
Given I charge <n>
Scenarios:
| n |
| 1 |
| 10 |
