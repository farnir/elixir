defmodule MyGenericServer do
	def loop({callback_module, server_state}) do
		receive do
			{:cast, request} -> 
				server_state = callback_module.handle_cast(request, server_state)
			{:call, pid, request} -> 
				server_state = callback_module.handle_call(request, server_state)
				send(pid, server_state)
		end
		loop({callback_module, server_state})

	end

	def cast(process_pid, request) do
		send(process_pid, {:cast, request})
		{:ok}		
	end

	def call(process_pid, request) do
		send(process_pid, {:call, self(), request})
		receive do 
			{value, state} -> {tmp, _} = {value, state}
		end
		tmp
	end

	def start_link(callback_module, server_initial_state) do
		pid = spawn_link(fn -> loop({callback_module, server_initial_state}) end)
		{:ok, pid}
	end
end