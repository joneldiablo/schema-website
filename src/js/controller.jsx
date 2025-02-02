import React from "react";
import {
  HashRouter,
  BrowserRouter,
  withRouter,
  Route,
} from "react-router-dom";
import { AnimatedSwitch } from 'react-router-transition';
import importedComponent from 'react-imported-component';
import urlJoin from "url-join";

import { setSchema } from "./functions";
import mapRoutes from "./map-routes";
import Template from "./containers/template";
import Page from "./containers/page";
import Section from "./containers/section";
import getTransition from "./transitions";

export default class Controller extends React.Component {

  static defaultProps = {
    schema: { routes: [] },
    components: {},
    Template,
    Page,
    Section
  }

  state = {
    mapRoutes: mapRoutes(this.props.schema.routes),
    allRoutes: this.getRoutes(this.props.schema.routes)
  }

  resolveRefs(item) {
    if (Array.isArray(item)) {
      return item.map(a => this.resolveRefs(a));
    } else if (typeof item === 'object') {
      let toReturn = {};
      Object.keys(item)
        .forEach(k => {
          if (k === 'ref') {
            Object.assign(toReturn, this.resolveRefs(item[k]));
            toReturn['name'] = item[k].substring(1).split('.').pop();
          } else if (k === 'attributes') {
            toReturn[k] = Object.assign({}, toReturn[k] || {}, this.resolveRefs(item[k]));
          }
          else toReturn[k] = this.resolveRefs(item[k])
        });
      return toReturn;
    } else if (typeof item === 'string' && item[0] === '$') {
      let { schema } = this.props;
      let keys = item.substring(1).split('.');
      let data = keys.reduce((obj, key) => obj[key], schema);
      return this.resolveRefs(data);
    } else return item;
  }

  components({ type, from } = {}) {
    let Component =
      this.props.components[type] ||
      importedComponent(() => {
        // use the template string (`...`) because "import" 
        // function not working with variables
        return import(`${type || from}`);
      }, {
        LoadingComponent: () => 'loading',
        ErrorComponent: () => 'error'
      })
    return withRouter(Component);
  }

  componentWillMount() {
    setSchema(this.props.schema);
  }

  pages(pageId) {
    let page = this.resolveRefs(pageId) || [];
    if (!page.id) page.id = pageId.split('.').pop();
    let { content } = page;
    if (Array.isArray(page)) content = page;
    let ThisPage = this.props.Page;
    let ThisSection = this.props.Section;
    return <ThisPage {...page}>
      {content.map((item, i) =>
        typeof item === 'object' ?
          <ThisSection key={i} {...item} Component={this.components(item)} >
            {Array.isArray(item.content) && item.content.map((c, j) =>
              typeof c === 'object' ?
                <ThisSection key={j} {...c} Component={this.components(c)} /> : c
            )}
          </ThisSection> : item
      )}
    </ThisPage>
  }

  templates(templateId, children) {
    let template = this.resolveRefs(templateId) || [];
    let { content } = template;
    if (Array.isArray(template)) content = template;
    let ThisTemplate = this.props.Template;
    let ThisSection = this.props.Section;
    return <ThisTemplate {...template}>
      {content.map((item, i) => <ThisSection key={i} {...item} Component={this.components(item)} >
        {item.allowChildren && children}
      </ThisSection>)}
    </ThisTemplate>
  }

  getRoutes(schema, parent = '/', key) {
    let type = Array.isArray(schema) ? 'array' : typeof schema;
    switch (type) {
      case 'array': {
        return schema.map((schemaItem, i) => this.getRoutes(schemaItem, parent, i));
      }
      case 'object': {
        const getThisPaths = (thisRoutes) => {
          return thisRoutes.map(r => {
            if (!r.path)
              return getThisPaths(r.children);
            if (Array.isArray(r.path)) {
              return r.path.map(p => urlJoin(parent, p));
            }
            return urlJoin(parent, r.path || '')
          });
        }
        let { template, content, children, path, exact, transition } = schema;
        let absPath = Array.isArray(path) ?
          path.map(p => urlJoin(parent, p))
          : urlJoin(parent, path || '/');
        let props = {
          path: path ? absPath : getThisPaths(children).flat(),
          key,
          exact
        }
        let childrenRoutes = <>
          {content && this.pages(content)}
          {children && <AnimatedSwitch {...getTransition(transition)}>
            {this.getRoutes(children, absPath)}
          </AnimatedSwitch>}
        </>;
        return <Route {...props} >
          {template ?
            this.templates(template, childrenRoutes) :
            childrenRoutes
          }
        </Route>
      }
      default:
        throw 'Invalid type: ' + type;
    }
  }

  render() {
    return this.state.allRoutes;
  }
}

export const RouterController = (props) => {
  let RController = withRouter(Controller);
  return (<RController {...props} />);
}

export const BrowserRouterController = (props) => {
  let RController = withRouter(Controller);
  return (<BrowserRouter><RController {...props} /></BrowserRouter>);
}

export const HashRouterController = (props) => {
  let RController = withRouter(Controller);
  return (<HashRouter><RController {...props} /></HashRouter>);
}