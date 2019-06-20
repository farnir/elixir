defmodule KBRW do
	use Application

	@doc """
	Main application that create the Supervisor.
	"""
	def start(_type, _args) do
		KBRW.Supervisor.start_link()
	end
end
