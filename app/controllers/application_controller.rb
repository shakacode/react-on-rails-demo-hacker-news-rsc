class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  private

  def apply_public_cache(ttl:, etag:)
    expires_in ttl, public: true
    append_vary_header("Accept")
    fresh_when(
      etag: Array(etag),
      last_modified: cache_window_start(ttl),
      public: true,
    )
  end

  def cache_window_start(ttl)
    ttl_in_seconds = ttl.to_i
    Time.zone.at((Time.current.to_i / ttl_in_seconds) * ttl_in_seconds)
  end

  def append_vary_header(*values)
    existing_values = response.headers["Vary"].to_s
      .split(",")
      .map(&:strip)
      .reject(&:blank?)

    response.headers["Vary"] = (existing_values | values).join(", ")
  end
end
