function RemarkAdd (config) {
  this.readConfig(config)
  this.initialize()
  this.listen()
}

RemarkAdd.prototype.readConfig = function (config) {
  this.apiUrl = config.apiUrl
  this.indexPath = config.indexPath
  this.addPath = config.addPath
  this.remarkInputId = config.remarkInputId ? '#' + config.remarkInputId : '#url'
  this.remarkButtonId = config.remarkButtonId ? '#' + config.remarkButtonId : '#add'
  this.sharedRemark = this.getUrlParameter('remark')
}

RemarkAdd.prototype.initialize = function () {
  if (this.sharedRemark) {
    $(this.remarkInputId).val(this.sharedRemark)
    this.addRemark(this.sharedRemark)
  }
}

RemarkAdd.prototype.listen = function () {
  var self = this

  $(this.remarkButtonId).click(function () {
    var url = $(self.remarkInputId).val()
    self.addRemark(url)
  })
}

RemarkAdd.prototype.addRemark = function (url) {
  var self = this
  $.post(
    self.apiUrl + 'remark/',
    { url: url },
    function (result) {
      location.href = self.indexPath
    }
  )
}

RemarkAdd.prototype.getUrlParameter = function (key) {
  var regexS = '[\\?&]' + key + '=([^&#]*)'
  var regex = new RegExp(regexS)
  var results = regex.exec(location.href)
  return results == null ? null : results[1]
}
