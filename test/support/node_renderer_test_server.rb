# frozen_string_literal: true

require "fileutils"
require "socket"
require "timeout"

module NodeRendererTestServer
  extend self

  def start!
    return if running?

    @port = Integer(ENV.fetch("RENDERER_PORT"))
    log_file = Rails.root.join("tmp/node-renderer-test.log")
    FileUtils.mkdir_p(log_file.dirname)

    @pid = spawn(
      {
        "HN_API_BASE_URL" => ENV.fetch("HN_API_BASE_URL"),
        "NODE_ENV" => "test",
        "RENDERER_LOG_LEVEL" => "warn",
        "RENDERER_PASSWORD" => ENV.fetch("RENDERER_PASSWORD"),
        "RENDERER_PORT" => @port.to_s
      },
      "node",
      "client/node-renderer.js",
      chdir: Rails.root.to_s,
      out: log_file.to_s,
      err: log_file.to_s,
    )

    wait_until_ready
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
