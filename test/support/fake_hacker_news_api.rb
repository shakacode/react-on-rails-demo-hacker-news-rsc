# frozen_string_literal: true

require "cgi"
require "json"
require "socket"
require "timeout"
require "webrick"

module FakeHackerNewsAPI
  extend self

  BASE_TIME = 1_710_000_000
  TOP_STORY_IDS = (1001..1035).to_a.freeze

  def start!
    return if @server

    @port = available_port
    @server = WEBrick::HTTPServer.new(
      BindAddress: "127.0.0.1",
      Port: @port,
      Logger: WEBrick::Log.new($stdout, WEBrick::Log::FATAL),
      AccessLog: [],
    )
    @server.mount_proc("/v0") do |request, response|
      sleep(0.02) if request.path.include?("/item/")

      response.status = 200
      response["Content-Type"] = "application/json"
      response.body = JSON.generate(payload_for(request.path))
    end

    @thread = Thread.new { @server.start }
    wait_until_ready
  end

  def stop!
    return unless @server

    @server.shutdown
    @thread&.join(2)
  ensure
    @thread = nil
    @server = nil
    @port = nil
  end

  def base_url
    "http://127.0.0.1:#{@port}/v0"
  end

  private

  def payload_for(path)
    normalized_path = path.sub(%r{\A/v0/}, "")

    case normalized_path
    when "topstories.json"
      TOP_STORY_IDS
    when "newstories.json"
      [ 1101, 1102 ]
    when "beststories.json"
      [ 1201 ]
    when "askstories.json"
      [ 1301 ]
    when "showstories.json"
      [ 1401 ]
    when "jobstories.json"
      [ 1501 ]
    when %r{\Aitem/(\d+)\.json\z}
      item_payload(Regexp.last_match(1).to_i)
    when %r{\Auser/([^/]+)\.json\z}
      user_payload(CGI.unescape(Regexp.last_match(1)))
    else
      nil
    end
  end

  def item_payload(item_id)
    case item_id
    when 1001
      story_payload(
        id: 1001,
        by: "alice",
        title: "React Server Components in practice",
        url: "https://react.dev/learn/server-components",
        score: 321,
        descendants: 4,
        kids: [ 2001, 2002 ],
        time: BASE_TIME,
      )
    when *TOP_STORY_IDS.drop(1)
      index = item_id - 1000
      story_payload(
        id: item_id,
        by: "alice",
        title: "Top Story #{index}",
        url: "https://example.com/top-story-#{index}",
        score: 100 - (index % 20),
        descendants: 0,
        kids: [],
        time: BASE_TIME - (index * 300),
      )
    when 1101
      story_payload(
        id: 1101,
        by: "erin",
        title: "Newest Rails release notes",
        url: "https://rubyonrails.org",
        score: 45,
        descendants: 0,
        kids: [],
        time: BASE_TIME - 600,
      )
    when 1102
      story_payload(
        id: 1102,
        by: "erin",
        title: "Streaming patches landed",
        url: "https://github.com/shakacode/react_on_rails",
        score: 34,
        descendants: 0,
        kids: [],
        time: BASE_TIME - 900,
      )
    when 1201
      story_payload(
        id: 1201,
        by: "frank",
        title: "Best useMemo takedown",
        url: "https://example.com/best-story",
        score: 220,
        descendants: 2,
        kids: [ 2101 ],
        time: BASE_TIME - 1_200,
      )
    when 1301
      story_payload(
        id: 1301,
        by: "alice",
        title: "Ask HN: How are you adopting RSC?",
        score: 88,
        descendants: 1,
        kids: [ 2201 ],
        text: "<p>What tradeoffs are you seeing in production?</p>",
        time: BASE_TIME - 1_500,
        url: "",
      )
    when 1401
      story_payload(
        id: 1401,
        by: "carol",
        title: "Show HN: Rails-powered streaming demo",
        url: "https://example.com/show-hn",
        score: 66,
        descendants: 0,
        kids: [],
        time: BASE_TIME - 1_800,
      )
    when 1501
      story_payload(
        id: 1501,
        by: "dave",
        title: "Rails engineer at ShakaCode",
        score: 12,
        descendants: 0,
        kids: [],
        time: BASE_TIME - 2_100,
        type: "job",
        url: "",
      )
    when 2001
      comment_payload(
        id: 2001,
        by: "bob",
        descendants: 1,
        kids: [ 2003 ],
        text: "<p>Great demo.</p>",
        time: BASE_TIME + 60,
      )
    when 2002
      comment_payload(
        id: 2002,
        by: "",
        deleted: true,
        descendants: 1,
        kids: [ 2004 ],
        text: "",
        time: BASE_TIME + 90,
      )
    when 2003
      comment_payload(
        id: 2003,
        by: "carol",
        descendants: 0,
        kids: [],
        text: "<p>I agree.</p>",
        time: BASE_TIME + 120,
      )
    when 2004
      comment_payload(
        id: 2004,
        by: "dave",
        descendants: 0,
        kids: [],
        text: "<p>Nested under deleted comment.</p>",
        time: BASE_TIME + 150,
      )
    when 2101
      comment_payload(
        id: 2101,
        by: "erin",
        descendants: 0,
        kids: [],
        text: "<p>The benchmark chart sold me.</p>",
        time: BASE_TIME + 180,
      )
    when 2201
      comment_payload(
        id: 2201,
        by: "frank",
        descendants: 0,
        kids: [],
        text: "<p>We kept the client surface tiny.</p>",
        time: BASE_TIME + 210,
      )
    else
      nil
    end
  end

  def user_payload(user_id)
    case user_id
    when "alice"
      user_hash(
        id: "alice",
        karma: 8_200,
        about: "<p>Maintains the Rails side of the demo.</p>",
        submitted: [ 1001, 1301 ],
      )
    when "bob"
      user_hash(id: "bob", karma: 1_240, about: "<p>Commenter and reviewer.</p>", submitted: [ 2001 ])
    when "carol"
      user_hash(id: "carol", karma: 4_500, about: "<p>Enjoys nested threads.</p>", submitted: [ 2003, 1401 ])
    when "dave"
      user_hash(id: "dave", karma: 980, about: "<p>Job posts and moderation.</p>", submitted: [ 1501, 2004 ])
    when "erin"
      user_hash(id: "erin", karma: 2_300, about: "<p>Tracks release notes.</p>", submitted: [ 1101, 1102, 2101 ])
    when "frank"
      user_hash(id: "frank", karma: 3_150, about: "<p>Asks good architecture questions.</p>", submitted: [ 1201, 2201 ])
    else
      nil
    end
  end

  def story_payload(id:, by:, title:, score:, descendants:, kids:, time:, url:, text: nil, type: "story")
    {
      id: id,
      type: type,
      by: by,
      title: title,
      score: score,
      descendants: descendants,
      kids: kids,
      time: time,
      url: url,
      text: text
    }.compact
  end

  def comment_payload(id:, by:, descendants:, kids:, text:, time:, deleted: false)
    {
      id: id,
      type: "comment",
      by: by.presence,
      descendants: descendants,
      kids: kids,
      text: text.presence,
      time: time,
      deleted: deleted.presence
    }.compact
  end

  def user_hash(id:, karma:, about:, submitted:)
    {
      id: id,
      created: BASE_TIME - 86_400,
      karma: karma,
      about: about,
      submitted: submitted
    }
  end

  def available_port
    server = TCPServer.new("127.0.0.1", 0)
    server.addr[1]
  ensure
    server&.close
  end

  def wait_until_ready
    Timeout.timeout(5) do
      loop do
        begin
          socket = TCPSocket.new("127.0.0.1", @port)
          socket.close
          break
        rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH
          sleep 0.05
        end
      end
    end
  end
end
