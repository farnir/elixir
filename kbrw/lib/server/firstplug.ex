  defmodule TheFirstPlug do
    import Plug.Conn

    def init(opts) do
      opts
    end

    def call(conn, _opts) do
      put_resp_content_type(conn, "application/json")
      cond do
      	conn.request_path == "/me" -> send_resp(conn, 200, "I am The First, The One, Le Geant Plug Vert, Le Grand Plug, Le Plug Cosmique.")	
      	conn.request_path == "/" -> send_resp(conn, 200, "Welcome to the new world of Plugs!")     	
      	true -> send_resp(conn, 404, "Go away, you are not welcome here.")
      end
    end
  end