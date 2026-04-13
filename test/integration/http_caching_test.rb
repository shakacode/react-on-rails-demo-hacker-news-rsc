require "test_helper"

class HttpCachingTest < ActionDispatch::IntegrationTest
  test "stories pages expose public caching and etags" do
    get "/"

    assert_response :success
    assert_match(/max-age=60/, response.headers["Cache-Control"])
    assert_includes response.headers["Vary"], "Accept"
    assert response.headers["ETag"].present?
    assert_includes response.body, "aria-hidden=\"true\""

    get "/", headers: { "If-None-Match" => response.headers["ETag"] }

    assert_response :not_modified
  end

  test "item pages expose five minute caching" do
    get "/item/1001"

    assert_response :success
    assert_match(/max-age=300/, response.headers["Cache-Control"])
    assert_includes response.headers["Vary"], "Accept"
  end

  test "user pages expose ten minute caching" do
    get "/user/alice"

    assert_response :success
    assert_match(/max-age=600/, response.headers["Cache-Control"])
    assert_includes response.headers["Vary"], "Accept"
  end

  test "missing resources render 404 pages" do
    get "/item/999999"

    assert_response :not_found
    assert_match(/Item not found/, response.body)

    get "/user/missing-user"

    assert_response :not_found
    assert_match(/User not found/, response.body)
  end
end
