Feature: DocStrings
  Scenario: Multiline
    Given a document
      """
      line one
        nested
      line three
      """
    Then done
