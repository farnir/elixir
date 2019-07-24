defmodule KBRW.EwebRouter do
    
    use Ewebmachine.Builder.Resources
    if Mix.env == :dev, do: plug Ewebmachine.Plug.Debug

    resources_plugs error_forwarding: "/error/:status", nomatch_404: true

    require EEx
    EEx.function_from_file :def, :layout, "web/layout.html.eex", [:render]
    plug :resource_match
    plug Ewebmachine.Plug.Run
    plug Ewebmachine.Plug.Send

    def formatParams(map) do
		map = Map.delete(map, "page")
		map = Map.delete(map, "rows")
		map = Map.delete(map, "sort")
		Enum.map_join(map, "+AND+", fn
			{key, val} -> ~s{#{key}:#{val}}
		end)
    end
    
    resource "/api/me" do %{} after
        content_types_provided do: ['application/json': :to_json]
        defh to_json do
            Poison.encode!(%{"user" => "Valentin"})
        end
    end

    resource "/api/orders" do %{} after
        allowed_methods do: ["GET","DELETE"]
        content_types_provided do: ['application/json': :to_json]
        defh to_json do
            conn = fetch_query_params(conn)
            params_map = conn.query_params
            params = KBRW.EwebRouter.formatParams(params_map)
            cond do
                Map.has_key?(params_map, "rows") && Map.has_key?(params_map, "page") ->
                    {page, _} = Integer.parse(params_map["page"])
                    {rows, _} = Integer.parse(params_map["rows"])
                    KBRW.Riak.search("orders", params, page, rows)
                Map.has_key?(params_map, "page") ->
                    {page, _} = Integer.parse(params_map["page"])
                    KBRW.Riak.search("orders", params, page)
                true -> KBRW.Riak.search("orders", params)
            end
        end
        delete_resource do
            conn = fetch_query_params(conn)
            params = conn.query_params
            cond do
                Map.has_key?(params, "key") -> 
                    KBRW.Riak.deleteObject("buck", params["key"])
                true -> false
            end
        end
    end

    resource "/api/pay" do %{} after
        allowed_methods do: ["POST"]
        process_post do
            {:ok, body, conn} = Plug.Conn.read_body(conn)
            params = Poison.decode!(body)
            cond do
                Map.has_key?(params, "key") -> 
                    Poison.encode!(KBRW.Transistor.start_link(Map.get(params, "key")))
                    true
                true -> false
            end
        end
    end

    resource "/public/*path" do %{path: Enum.join(path,"/")} after
        resource_exists do:
          File.regular?(path state.path)
        content_types_provided do:
          [{state.path|>Plug.MIME.path|>default_plain,:to_content}]
        defh to_content, do:
          File.stream!(path(state.path), [], 300_000_000)
        defp path(relative), do: "priv/static//#{relative}"
        defp default_plain("application/octet-stream"), do: "text/plain"
        defp default_plain(type), do: type
      end
    
    resource "*_" do %{} after
        content_types_provided do: ['text/html': :to_html]
        defh to_html do
            render = Reaxt.render!(:app, %{path: conn.request_path, cookies: conn.cookies, query: conn.params}, 30_000)
		    KBRW.EwebRouter.layout(render)
        end
    end
    
end