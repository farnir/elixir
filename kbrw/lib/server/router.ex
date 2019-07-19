defmodule Server.Router do
	use Plug.Router

	plug Plug.Static, at: "/public", from: :kbrw
	require EEx
	EEx.function_from_file :defp, :layout, "web/layout.html.eex", [:render]

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

	get "/api/legacy" do
		results = KBRW.Database.all(KBRW.Database)
		conn = put_resp_content_type(conn, "text/json")
		send_resp(conn, 200, Poison.encode!(results))
	end

	get "/api/order/:id" do
		result = KBRW.Database.get(KBRW.Database, id)
		send_resp(conn, 200, Poison.encode!(result))
	end

	get "/api/me" do
		send_resp(conn, 200, Poison.encode!(%{"user" => "Valentin"}))
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

	def formatParams(map) do
		map = Map.delete(map, "page")
		map = Map.delete(map, "rows")
		map = Map.delete(map, "sort")
		Enum.map_join(map, "+AND+", fn
			{key, val} -> ~s{#{key}:#{val}}
		end)
	end

	get "/api/orders" do
		conn = fetch_query_params(conn)
		params_map = conn.query_params
		params = formatParams(params_map)
		result = cond do
			Map.has_key?(params_map, "rows") && Map.has_key?(params_map, "page") ->
				{page, _} = Integer.parse(params_map["page"])
				{rows, _} = Integer.parse(params_map["rows"])
				KBRW.Riak.search("honara", params, page, rows)
			Map.has_key?(params_map, "page") ->
				{page, _} = Integer.parse(params_map["page"])
				KBRW.Riak.search("honara", params, page)
			true -> KBRW.Riak.search("honara", params)
		end
		send_resp(conn, 200, result)
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

	get "/api/delete" do
		conn = fetch_query_params(conn)
		params = conn.query_params
		cond do
			Map.has_key?(params, "id") -> 
				KBRW.Database.delete(KBRW.Database, params["id"])
				send_resp(conn, 201, Poison.encode!(%{"status" => "ok"}))
			true -> send_resp(conn, 400, "Bad parameters.")
		end
	end

	get _ do
		render = Reaxt.render!(:app, %{path: conn.request_path, cookies: conn.cookies, query: conn.params},30_000)
		send_resp(put_resp_header(conn,"content-type","text/html;charset=utf-8"), render.param || 200,layout(render))
	  end
end