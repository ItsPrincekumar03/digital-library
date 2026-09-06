function success(res, statusCode, message, data) {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

function error(res, statusCode, message, errors) {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, error };