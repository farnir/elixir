defmodule KBRW.Database do
	use GenServer

	@doc """
	Starts the GenServer.
	"""
	def start_link(initial_value) do
		GenServer.start_link(__MODULE__, initial_value, name: __MODULE__)
	end

	@doc """
	Quick function to insert data only if it doesn't exist.
	"""
	def insert(server, key, value) do
		GenServer.cast(server, {:put, key, value})
	end

	@doc """
	Quick function to delete data.
	"""
	def delete(server, key) do
		GenServer.cast(server, {:delete, key})
	end

	@doc """
	Quick function to modified data.
	"""
	def change(server, key, value) do
		GenServer.cast(server, {:post, key, value})
	end

	@doc """
	Quick function to read data.
	"""
	def get(server, key) do
		GenServer.call(server, {:get, key})
	end

	@doc """
	Create the ets table.
	"""
	@impl true
	def init(_) do
		:ets.new(:db_table, [:named_table])
  		{:ok, :ok}
	end

	@doc """
	Create a new entry in the Database only if the entry doesn't exist.
	"""
	@impl true
	def handle_cast({:put, key, value}, intern_state) do
		:ets.insert_new(:db_table, {key, value})
		{:noreply, intern_state}
	end

	@doc """
	Deletes a row.
	"""
	def handle_cast({:delete, key}, intern_state) do
		:ets.delete(:db_table, key)
		{:noreply, intern_state}
	end

	@doc """
	Modifies a row.
	"""
	def handle_cast({:post, key, value}, intern_state) do
		:ets.insert(:db_table, {key, value})
		{:noreply, intern_state}
	end

	@doc """
	Lookup for a key/value.
	"""
	def handle_call({:get, key}, _from, intern_state) do
		result = :ets.lookup(:db_table, key)
		{_, value} = cond  do
			length(result) > 0 -> hd(result)
			true -> {:empty, :empty}
		end
		{:reply, value, intern_state}
	end
end