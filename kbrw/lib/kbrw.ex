defmodule Kbrw do
	def main() do
		{:ok, my_account} = AccountServer.start_link(4)
		MyGenericServer.cast(my_account, {:credit, 2})
		MyGenericServer.cast(my_account, {:credit, 2})
		MyGenericServer.cast(my_account, {:debit, 3})
		amount = MyGenericServer.call(my_account, :get)
		IO.puts "current credit hold is #{amount}"
	end
end
