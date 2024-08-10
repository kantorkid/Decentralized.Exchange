import { combineReducers } from 'redux';

function web3(state = {}, action) {
	switch (action.type) {
	// case 'INCREMENT':
	// 	return state + 1
	// case 'DECREMENT':
	// 	return state -1
	default:
		return state
	}
}

const rootReducer = combineReducers({
	web3
})

export default rootReducer