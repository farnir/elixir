  defmodule TheFirstPlug do
    import Plug.Conn

    def init(opts) do
      opts
    end

    def call(conn, _opts) do
      put_resp_content_type(conn, "application/json")
      send_resp(conn, 200, "Hello world")
    end
  end