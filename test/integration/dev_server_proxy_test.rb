require "test_helper"
require "rack/mock"
require "webrick"

class DevServerProxyTest < ActiveSupport::TestCase
  test "forwards development asset requests to the configured backend" do
    server = WEBrick::HTTPServer.new(
      BindAddress: "127.0.0.1", Port: 0,
      Logger: WEBrick::Log.new(File::NULL), AccessLog: []
    )
    server.mount_proc("/") { |_request, response| response.body = "development asset" }
    thread = Thread.new { server.start }
    port = server.listeners.first.addr[1]
    dev_server = Struct.new(:host, :port, :protocol) do
      def running? = true
      def host_with_port = "#{host}:#{port}"
    end.new("127.0.0.1", port, "http")
    instance = Struct.new(:config, :dev_server).new(Shakapacker.config, dev_server)
    proxy = Shakapacker::DevServerProxy.new(->(_env) { [ 404, {}, [] ] }, shakapacker: instance)
    path = Shakapacker.config.public_output_path.relative_path_from(Shakapacker.config.public_path)

    status, _headers, response = proxy.call(Rack::MockRequest.env_for("http://localhost/#{path}/probe.js"))

    assert_equal 200, status.to_i
    assert_equal "development asset", response.join
  ensure
    server&.shutdown
    thread&.join
  end
end
