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
  	def init([]) do
  		children = [
      		KBRW.Database
		]

  		supervise(Enum.map(children, &worker(&1, [[]])), strategy: :one_for_one)
  	end
end