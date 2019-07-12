defmodule Server.Router do
	use Plug.Router

	plug Plug.Static, from: "priv/static", at: "/static"
	plug(:match)
	plug(:dispatch)

	get "/" do 
		conn = fetch_query_params(conn)
		params = conn.query_params
		result = cond do
			Map.has_key?(params, "id") -> 
				KBRW.Database.get(KBRW.Database, params["id"])
			true -> "No result found."	
		end
		result = cond do 
			result == :empty -> "No result found."
			true -> result
		end
		send_resp(conn, 200, result)
	end

	get "/api/orders" do
		results = KBRW.Database.all(KBRW.Database)
		IO.puts("Incoming get all orders")
		conn = put_resp_content_type(conn, "text/json")
		send_resp(conn, 200, Poison.encode!(results))
	end
	
	get "/search" do
		conn = fetch_query_params(conn)
		params = conn.query_params
		{_, result} = cond do
			map_size(params) > 0 -> 
				KBRW.Database.search(KBRW.Database, Map.to_list(params))
			true -> {:error, "No result found."}	
		end
		send_resp(conn, 200, inspect(result))
	end

	get "/create" do
		conn = fetch_query_params(conn)
		params = conn.query_params
		cond do
			Map.has_key?(params, "id") && Map.has_key?(params, "value") -> 
				KBRW.Database.insert(KBRW.Database, params["id"], params["value"])
				send_resp(conn, 201, "New entry created.")
			true -> send_resp(conn, 400, "Bad parameters.")
		end
	end

	get "/change" do
		conn = fetch_query_params(conn)
		params = conn.query_params
		cond do
			Map.has_key?(params, "id") && Map.has_key?(params, "value") -> 
				KBRW.Database.change(KBRW.Database, params["id"], params["value"])
				send_resp(conn, 201, "Entry modified.")
			true -> send_resp(conn, 400, "Bad parameters.")
		end
	end

	get "/delete" do
		conn = fetch_query_params(conn)
		params = conn.query_params
		cond do
			Map.has_key?(params, "id") -> 
				KBRW.Database.delete(KBRW.Database, params["id"])
				send_resp(conn, 201, "Entry deleted.")
			true -> send_resp(conn, 400, "Bad parameters.")
		end
	end

	get _, do: send_file(conn, 200, "priv/static/index.html")
end