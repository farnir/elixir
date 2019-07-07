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

  	defmacro my_error(code: code, content: content) do
  		quote do
  			def error_handler(conn), do: send_resp(conn, unquote(code), unquote(content))
  		end
  	end

	defmacro __before_compile__(_env) do
		quote do
			def init(opts) do
      			opts
    		end

    		def generic_error(conn) do
    			send_resp(conn, 404, "Go away, you are not welcome here")
    		end

			def call(conn, _opts) do
				put_resp_content_type(conn, "application/json")
				name = String.to_atom(conn.request_path)
				cond do
					Enum.member?(@routes, name) -> apply(__MODULE__, name, [conn])
					function_exported?(__MODULE__, :error_handler, 1) -> apply(__MODULE__, :error_handler, [conn])
					true -> apply(__MODULE__, :generic_error, [conn])
				end
			end
		end
	end
end