ENV["RAILS_ENV"] ||= "test"
ENV["REACT_RENDERER_URL"] ||= "http://127.0.0.1:3800"
ENV["RENDERER_PASSWORD"] ||= "devPassword"
require_relative "../config/environment"
require "rails/test_help"
require "fileutils"
require_relative "support/fake_hacker_news_api"
require_relative "support/node_renderer_test_server"

FakeHackerNewsAPI.start!
ENV["HN_API_BASE_URL"] = FakeHackerNewsAPI.base_url
FileUtils.rm_rf(Rails.root.join("tmp/.node-renderer-bundles"))
generated_server_bundle_path = Rails.root.join("app/javascript/generated/server-bundle-generated.js")

unless generated_server_bundle_path.exist?
  raise "Failed to generate test packs" unless system({ "RAILS_ENV" => "test" }, "bin/shakapacker-precompile-hook")
end

raise "Failed to compile test assets" unless system({ "RAILS_ENV" => "test" }, "bin/shakapacker")
NodeRendererTestServer.start!

Minitest.after_run do
  NodeRendererTestServer.stop!
  FakeHackerNewsAPI.stop!
end

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: 1)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end
