# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module HackerNewsClient
  DEFAULT_BASE_URL = "https://hacker-news.firebaseio.com/v0"
  REQUEST_TIMEOUT_SECONDS = 5

  class Error < StandardError; end
  class NotFound < Error; end

  class << self
    def fetch_item(item_id)
      fetch_json("item/#{item_id}.json")
    end

    def fetch_user(user_id)
      fetch_json("user/#{URI.encode_www_form_component(user_id)}.json")
    end

    private

    def fetch_json(path)
      uri = URI.join(normalized_base_url, path)

      response = Net::HTTP.start(
        uri.host,
        uri.port,
        use_ssl: uri.scheme == "https",
        open_timeout: REQUEST_TIMEOUT_SECONDS,
        read_timeout: REQUEST_TIMEOUT_SECONDS,
      ) do |http|
        http.get(uri.request_uri, { "Accept" => "application/json" })
      end

      case response
      when Net::HTTPNotFound
        raise NotFound, "#{uri} returned 404"
      when Net::HTTPSuccess
        payload = response.body.present? ? JSON.parse(response.body) : nil
        raise NotFound, "#{uri} returned null" if payload.nil?

        payload
      else
        raise Error, "#{uri} returned #{response.code}"
      end
    rescue JSON::ParserError => error
      raise Error, "#{uri} returned invalid JSON: #{error.message}"
    end

    def normalized_base_url
      base_url = ENV.fetch("HN_API_BASE_URL", DEFAULT_BASE_URL)
      base_url.end_with?("/") ? base_url : "#{base_url}/"
    end
  end
end
