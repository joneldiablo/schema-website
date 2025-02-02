import React from 'react';
import { createHashHistory } from 'history';
import { Router, Link } from "react-router-dom";
import mapRoutes from "../src/js/map-routes";
import { HashRouterController, RouterController } from "../src/js/controller";
import { Template, Page, Section } from "../src/js/editor-containers";
import 'bootstrap';
import '../src/scss/style.scss';

const schema = require('./schemas/ecommerce.json');
const history = createHashHistory();
const rs = mapRoutes(schema.routes);
const Menu = () => <div>
  <ul>
    {Object.keys(rs).map(route =>
      <li key={route}>
        {rs[route]}
        <Link to={route}>
          <small>
            &nbsp;({route})
          </small>
        </Link>
      </li>
    )}
  </ul>
  <hr />
</div>

export default {
  title: 'Controller'
};

export const EcommerceCustomHistoryController = () => <Router history={history}>
  <Menu />
  <RouterController schema={schema} />
</Router>

export const EcommerceHashRouterController = () => <>
  <HashRouterController schema={schema} />
</>

export const EcommerceEditorComponents = () => <>
  <HashRouterController schema={schema} Template={Template} Page={Page} Section={Section} />
</>