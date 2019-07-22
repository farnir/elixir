defmodule KBRW.Supervisor do
	use Supervisor

	@doc """
	Starts the Supervisor 
	"""
	def start_link do
  		Supervisor.start_link(__MODULE__, [], name: __MODULE__)
	end

	@doc """
	Init the Supervisor with our GenServer module.
	"""
	@impl true
  	def init(_init_args) do
  		children = [
      		KBRW.Database,
			  #Plug.Adapters.Cowboy.child_spec(:http, Server.Router, [], [port: 4001]),
			  Plug.Adapters.Cowboy.child_spec(:http, KBRW.EwebRouter, [], port: 4002)
    	]

  		Supervisor.init(children, strategy: :one_for_one)
  	end
end