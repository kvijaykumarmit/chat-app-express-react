import {React} from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';

const Login = () =>{

    const { user, login, loading } = useAuth();

    // Redirect if user is already logged in
    if (!loading && user) {
      return <Navigate to="/chat" replace />; // Redirects to "/login" if not logged in
    }
   
    const initialValues = {
        email: '',
        password: ''
    };

    const validationSchema = Yup.object({
        email: Yup.string().email('Invalid email format').required('Email is required'),
        password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
    });

    // const navigate = useNavigate(); 

    const onSubmit = async (values) => {
        try {
          login(values); 
        } catch (error) {
        //   setErrorMessage('Invalid email or password');
        }
    };


    return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header text-center">
                  <h4>Login</h4>
                </div>
                <div className="card-body">
                  <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={onSubmit}                  >
                    {({ errors, touched, isValid }) => (
                      <Form>
                        <div className="form-group mb-3">
                          <label htmlFor="email" className="form-label">Email</label>
                          <Field
                            id="email"
                            type="email"
                            name="email"
                            className={`form-control ${touched.email && errors.email ? 'is-invalid' : ''}`}
                            placeholder="Enter email"
                          />
                          <ErrorMessage name="email" component="small" className="text-danger" />
                        </div>
    
                        <div className="form-group mb-3">
                          <label htmlFor="password" className="form-label">Password</label>
                          <Field
                            id="password"
                            type="password"
                            name="password"
                            className={`form-control ${touched.password && errors.password ? 'is-invalid' : ''}`}
                            placeholder="Enter password"
                          />
                          <ErrorMessage name="password" component="small" className="text-danger" />
                        </div>
    
                        <button type="submit" className="btn btn-primary w-100" disabled={!isValid}>
                          Login
                        </button>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
}

export default Login;
