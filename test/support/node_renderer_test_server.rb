# frozen_string_literal: true

require "fileutils"
require "socket"
require "timeout"

module NodeRendererTestServer
  extend self

  PORT = 3800

  def start!
    return if running?

    @port = PORT
    log_file = Rails.root.join("tmp/node-renderer-test.log")
    FileUtils.mkdir_p(log_file.dirname)

    @pid = spawn(
      {
        "HN_API_BASE_URL" => ENV.fetch("HN_API_BASE_URL"),
        "NODE_ENV" => "test",
        "RENDERER_LOG_LEVEL" => "warn",
        "RENDERER_PASSWORD" => "devPassword",
        "RENDERER_PORT" => @port.to_s
      },
      "node",
      "client/node-renderer.js",
      chdir: Rails.root.to_s,
      out: log_file.to_s,
      err: log_file.to_s,
    )

    wait_until_ready

    ReactOnRailsPro.configuration.renderer_password = "devPassword"
    ReactOnRailsPro.configuration.renderer_url = "http://127.0.0.1:#{@port}"
  end

  def stop!
    return unless @pid

    Process.kill("TERM", @pid)
    Timeout.timeout(5) { Process.wait(@pid) }
  rescue Errno::ECHILD, Errno::ESRCH, Timeout::Error
    Process.kill("KILL", @pid) rescue nil
  ensure
    @pid = nil
    @port = nil
  end

  private

  def running?
    return false unless @pid

    Process.kill(0, @pid)
    true
  rescue Errno::ESRCH
    false
  end

  def wait_until_ready
    Timeout.timeout(15) do
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
