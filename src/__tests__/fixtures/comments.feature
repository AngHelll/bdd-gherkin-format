# language: en
# file-level note
Feature: Comments and descriptions
As a cashier
I want clear notes in the feature
# before first scenario
@fast
Scenario: Card payment
# setup for the happy path
Given a card
# between steps
When I charge
Then it is approved
# before refunds rule

Rule: Refunds
# note under rule
Scenario: Full refund
A free-text description under the scenario
Given a prior charge
Then refund succeeds
