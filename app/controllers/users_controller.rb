# frozen_string_literal: true

class UsersController < ApplicationController
  include ReactOnRailsPro::Stream

  def show
    @hn_user_props = {
      userId: params[:id].to_s
    }

    response.status = :not_found if missing_user?(@hn_user_props[:userId])

    unless response.status == 404
      apply_public_cache(ttl: 10.minutes, etag: [ "user", @hn_user_props[:userId] ])
      return if performed?
    end

    stream_view_containing_react_components(template: "users/show")
  end

  private

  def missing_user?(user_id)
    return true if user_id.blank?

    HackerNewsClient.fetch_user(user_id)
    false
  rescue HackerNewsClient::NotFound
    true
  rescue HackerNewsClient::Error => error
    Rails.logger.warn("UsersController could not preflight HN user #{user_id}: #{error.message}")
    false
  end
end
