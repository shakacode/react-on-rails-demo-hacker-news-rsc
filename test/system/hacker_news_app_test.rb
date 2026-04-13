require "application_system_test_case"

class HackerNewsAppTest < ApplicationSystemTestCase
  test "renders story lists for all feed types and paginates top stories" do
    visit "/"
    assert_text "React Server Components in practice"

    click_link "More →"
    assert_current_path "/news/2"
    assert_text "Top Story 31"

    {
      "new" => "Newest Rails release notes",
      "best" => "Best useMemo takedown",
      "ask" => "Ask HN: How are you adopting RSC?",
      "show" => "Show HN: Rails-powered streaming demo",
      "job" => "Rails engineer at ShakaCode"
    }.each do |story_type, expected_title|
      visit "/?type=#{story_type}"
      assert_text expected_title
    end
  end

  test "renders nested comments and lets the user collapse a thread" do
    visit "/item/1001"

    assert_text "4 comments", wait: 10
    assert_text "Great demo.", wait: 10
    assert_text "I agree.", wait: 10
    assert_text "Nested under deleted comment.", wait: 10

    first("summary", text: "[-]").click

    assert_selector "summary", text: "[+2]"
    assert_no_text "I agree."
  end

  test "renders user profiles" do
    visit "/user/alice"

    assert_text "User: alice"
    assert_text "8200"
    assert_text "Maintains the Rails side of the demo."
  end
end
