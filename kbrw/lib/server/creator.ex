defmodule Server.TheCreator do
	defmacro __using__(_opts) do
		quote do
			import Server.TheCreator
			import Plug.Conn

			@routes []

			@before_compile Server.TheCreator
		end
	end

	defmacro my_get(description, do: block) do
    	function_name = String.to_atom(description)
    	quote do
      		@routes [unquote(function_name) | @routes]
      		def unquote(function_name)(conn), do: send_resp(conn, elem(unquote(block), 0), elem(unquote(block), 1))
    	end
  	end

	defmacro __before_compile__(_env) do
		quote do
			def init(opts) do
      			opts
    		end

			def call(conn, _opts) do
				put_resp_content_type(conn, "application/json")
				name = String.to_atom(conn.request_path)
				if Enum.member?(@routes, name) do
					apply(__MODULE__, name, [conn])
				end
			end
		end
	end
end