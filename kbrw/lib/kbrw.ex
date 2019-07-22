defmodule KBRW do
	use Application

	@doc """
	Main application that create the Supervisor.
	"""
	def start(_type, _args) do
		Application.put_env(
			:reaxt,:global_config,
      		Map.merge(
        		Application.get_env(:reaxt,:global_config), %{localhost: "http://localhost:4002"}
      		)
    	)
    	Reaxt.reload
		KBRW.Supervisor.start_link()
	end
end
