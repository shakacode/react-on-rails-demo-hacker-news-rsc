# frozen_string_literal: true

class ItemsController < ApplicationController
  include ReactOnRailsPro::Stream

  def show
    @hn_item_props = {
      itemId: params[:id].to_i
    }

    response.status = :not_found if missing_item?(@hn_item_props[:itemId])

    unless response.status == 404
      apply_public_cache(ttl: 5.minutes, etag: [ "item", @hn_item_props[:itemId] ])
      return if performed?
    end

    stream_view_containing_react_components(template: "items/show")
  end

  private

  def missing_item?(item_id)
    return true if item_id <= 0

    payload = HackerNewsClient.fetch_item(item_id)
    payload["deleted"] || payload["dead"]
  rescue HackerNewsClient::NotFound
    true
  rescue HackerNewsClient::Error => error
    Rails.logger.warn("ItemsController could not preflight HN item #{item_id}: #{error.message}")
    false
  end
end
