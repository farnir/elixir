defimpl ExFSM.Machine.State, for: Map do
    def state_name(order), do: String.to_atom(order["status"]["state"])
    def set_state_name(order, name), do: Kernel.get_and_update_in(order["status"]["state"], fn state -> {state, Atom.to_string(name)} end)
    def handlers(order) do
      order["payment_handler"]
    end
  end
  
defmodule MyFSM.Paypal do                                                                                      
    use ExFSM
  
    deftrans init({:process_payment, []}, order) do 
      {:next_state, :not_verified, order}
    end 
  
    deftrans not_verified({:verification, []}, order) do 
      {:next_state, :finished, order}
    end
  end

  defmodule MyFSM.Stripe do                                                                                      
    use ExFSM
  
    deftrans init({:process_payment, []}, order) do 
      {:next_state, :not_verified, order}
    end 
  
    deftrans not_verified({:verification, []}, order) do 
      {:next_state, :finished, order}
    end
  end

  defmodule MyFSM.Delivery do                                                                                      
    use ExFSM
  
    deftrans init({:process_payment, []}, order) do 
      {:next_state, :not_verified, order}
    end 
  
    deftrans not_verified({:verification, []}, order) do 
      {:next_state, :finished, order}
    end
  end

  defmodule KBRW.Transistor do
    use GenServer
    
    def start_link(initial_value) do
        {:ok, pid} = GenServer.start_link(__MODULE__, initial_value, name: __MODULE__)
        changeState(pid)
    end

    def changeState(pid) do
        result = GenServer.call(pid, {:transit})
        GenServer.stop(pid)
        result
    end
    
    @impl true
    def init(id) do
  		{:ok, id}
    end
    
    def chooseTrans(state) do
        cond do
            state == "init" -> :process_payment
            state == "not_verified" -> :verification
            true -> :error
        end
    end

    @impl true
    def handle_call({:transit}, _from, intern_state) do
        {_, record} = KBRW.Riak.getObject('buck', intern_state)
        order = Poison.Parser.parse!(record)
        {fsm, _} = MyRules.apply_rules(order["payment"], [])
        order = Map.put(order, "payment", Map.put(order["payment"], "payment_handler", fsm))
        nextTrans = chooseTrans(order["payment"]["status"]["state"])
        order = cond do 
          nextTrans != :error ->
            {:next_state, {_, new_order}} = ExFSM.Machine.event(order["payment"], {nextTrans, []})
            order = Map.put(order, "payment", new_order)
            KBRW.Riak.createObject('buck', Poison.encode!(order), intern_state)
            order
          true -> nextTrans
        end
		    {:reply, order, intern_state}
	end
  end