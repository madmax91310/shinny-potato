import {Component} from 'react'
export default class ReviewBoundary extends Component{
 state={error:null}
 static getDerivedStateFromError(error){return{error:String(error.message??error)}}
 render(){return this.state.error?<section className="dr-health-error" role="alert"><h2>{this.props.name} : lecture interrompue</h2><p>Ce bilan ne peut pas être certifié. Les autres rubriques restent consultables.</p><p>{this.state.error}</p><button onClick={()=>this.setState({error:null})}>Réessayer ce bilan</button></section>:this.props.children}
}
